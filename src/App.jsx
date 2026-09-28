import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import DecisionNode from './DecisionNode'

const STORAGE_KEY = 'be09-ai-decision-flow'

const initialNodes = [
  {
    id: '1',
    type: 'decision',
    position: { x: 100, y: 150 },
    data: {
      prompt: 'Is this a support request?',
    },
  },
  {
    id: '2',
    type: 'decision',
    position: { x: 500, y: 50 },
    data: {
      prompt: 'Does the customer need technical help?',
    },
  },
  {
    id: '3',
    type: 'decision',
    position: { x: 500, y: 300 },
    data: {
      prompt: 'Is this a sales request?',
    },
  },
]

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    sourceHandle: 'yes',
    target: '2',
    label: 'YES',
  },
  {
    id: 'e1-3',
    source: '1',
    sourceHandle: 'no',
    target: '3',
    label: 'NO',
  },
]

function App() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes)

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges)

  const [loaded, setLoaded] = useState(false)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')

  const [executionLog, setExecutionLog] = useState([])

  const nodeTypes = useMemo(
    () => ({
      decision: DecisionNode,
    }),
    []
  )

  // ==============================
  // LOAD SAVED WORKFLOW
  // ==============================

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        const workflow = JSON.parse(saved)

        setNodes(workflow.nodes || initialNodes)
        setEdges(workflow.edges || initialEdges)
      } catch {
        console.log('Could not load saved workflow')
      }
    }

    setLoaded(true)
  }, [setNodes, setEdges])

  // ==============================
  // SAVE WORKFLOW
  // ==============================

  useEffect(() => {
    if (!loaded) return

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nodes,
        edges,
      })
    )
  }, [nodes, edges, loaded])

  // ==============================
  // CONNECT NODES
  // ==============================

  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            label:
              connection.sourceHandle === 'yes'
                ? 'YES'
                : 'NO',
          },
          currentEdges
        )
      )
    },
    [setEdges]
  )

  // ==============================
  // UPDATE NODE PROMPT
  // ==============================

  const updatePrompt = useCallback(
    (id, prompt) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  prompt,
                  onChange: updatePrompt,
                },
              }
            : node
        )
      )
    },
    [setNodes]
  )

  // ==============================
  // ADD NODE
  // ==============================

  const addNode = () => {
    const newId = `${Date.now()}`

    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id: newId,
        type: 'decision',
        position: {
          x: 200,
          y: 450,
        },
        data: {
          prompt: 'Enter your decision question...',
          onChange: updatePrompt,
        },
      },
    ])
  }

  // ==============================
  // ADD CALLBACK TO NODES
  // ==============================

  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onChange: updatePrompt,
        },
      }))
    )
  }, [setNodes, updatePrompt])

  // ==============================
  // RUN WORKFLOW
  // ==============================

  const runWorkflow = async () => {
    if (nodes.length === 0) {
      setStatus('Add at least one decision node.')
      return
    }

    setRunning(true)
    setStatus('Starting workflow...')

    try {
      // Find starting node
      const targetNodeIds = new Set(
        edges.map((edge) => edge.target)
      )

      const startNode =
        nodes.find((node) => !targetNodeIds.has(node.id)) ||
        nodes[0]

      // Remove React-only functions before sending
      const cleanNodes = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          prompt: node.data.prompt,
        },
      }))

      const response = await fetch(
        'http://localhost:3000/api/workflow/start',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nodes: cleanNodes,
            edges,
            startNodeId: startNode.id,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.message || 'Failed to start workflow'
        )
      }

      setStatus(
        `✅ Workflow started successfully. Event ID: ${result.eventId}`
      )

      setExecutionLog([
        {
          nodeId: startNode.id,
          message: 'Workflow submitted to Inngest',
          time: new Date().toLocaleTimeString(),
        },
      ])
    } catch (error) {
      console.error(error)

      setStatus(`❌ ${error.message}`)

      setExecutionLog([
        {
          nodeId: '-',
          message: 'Workflow failed to start',
          time: new Date().toLocaleTimeString(),
        },
      ])
    } finally {
      setRunning(false)
    }
  }

  // ==============================
  // EXPORT WORKFLOW JSON
  // ==============================

  const exportWorkflow = () => {
    const workflow = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          prompt: node.data.prompt,
        },
      })),
      edges,
    }

    const blob = new Blob(
      [JSON.stringify(workflow, null, 2)],
      {
        type: 'application/json',
      }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'be09-workflow.json'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    setStatus('✅ Workflow exported successfully')
  }

  // ==============================
  // IMPORT WORKFLOW JSON
  // ==============================

  const importWorkflow = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target.result)

        if (!Array.isArray(workflow.nodes)) {
          throw new Error('Invalid nodes')
        }

        if (!Array.isArray(workflow.edges)) {
          throw new Error('Invalid edges')
        }

        setNodes(workflow.nodes)
        setEdges(workflow.edges)

        setStatus('✅ Workflow imported successfully')
      } catch (error) {
        console.error(error)

        setStatus('❌ Invalid workflow JSON file')
      }
    }

    reader.readAsText(file)

    // Allow importing the same file again
    event.target.value = ''
  }

  return (
    <div className="h-screen w-screen bg-slate-100">

      {/* ==============================
          TOP TOOLBAR
      ============================== */}

      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">

        {/* ADD NODE */}

        <button
          onClick={addNode}
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          + Add Decision Node
        </button>

        {/* RUN WORKFLOW */}

        <button
          onClick={runWorkflow}
          disabled={running}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running
            ? 'Running...'
            : '▶ Run Workflow'}
        </button>

        {/* EXPORT */}

        <button
          onClick={exportWorkflow}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
        >
          Export JSON
        </button>

        {/* IMPORT */}

        <label className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700">
          Import JSON

          <input
            type="file"
            accept=".json,application/json"
            onChange={importWorkflow}
            className="hidden"
          />
        </label>

      </div>

      {/* ==============================
          STATUS MESSAGE
      ============================== */}

      {status && (
        <div className="absolute bottom-4 left-4 z-10 max-w-xl rounded-lg bg-white px-4 py-3 text-sm shadow-lg">
          {status}
        </div>
      )}

      {/* ==============================
          EXECUTION LOG
      ============================== */}

      <div className="absolute right-4 top-4 z-10 w-72 rounded-xl bg-white p-4 shadow-lg">

        <h2 className="mb-3 text-lg font-bold">
          Execution Log
        </h2>

        {executionLog.length === 0 ? (
          <p className="text-sm text-slate-500">
            No workflow runs yet.
          </p>
        ) : (
          <div className="space-y-2">

            {executionLog.map((item, index) => (
              <div
                key={index}
                className="rounded-lg bg-slate-100 p-3 text-sm"
              >

                <div className="font-semibold">
                  {item.message}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Node: {item.nodeId}
                </div>

                <div className="text-xs text-slate-400">
                  {item.time}
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* ==============================
          REACT FLOW
      ============================== */}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >

        <Controls />

        <MiniMap />

        <Background />

      </ReactFlow>

    </div>
  )
}

export default App