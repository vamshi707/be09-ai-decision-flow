import { Handle, Position } from '@xyflow/react'

function DecisionNode({ id, data }) {
  const status = data.status || 'idle'

  const statusStyles = {
    idle: 'border-slate-300 bg-white',
    running: 'border-blue-500 bg-blue-50',
    completed: 'border-green-500 bg-green-50',
    failed: 'border-red-500 bg-red-50',
  }

  return (
    <div
      className={`w-64 rounded-xl border-2 p-4 shadow-lg transition-all ${statusStyles[status]}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold">
          AI Decision
        </div>

        <span className="text-xs font-semibold uppercase">
          {status}
        </span>
      </div>

      <textarea
        value={data.prompt}
        onChange={(event) => {
          data.onChange(id, event.target.value)
        }}
        className="nodrag w-full rounded-lg border p-2 text-sm outline-none"
        rows={3}
        placeholder="Enter your decision question..."
      />

      <div className="mt-3 flex justify-between text-xs font-semibold">
        <span>YES</span>
        <span>NO</span>
      </div>

      <Handle
        type="target"
        position={Position.Left}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{ top: '35%' }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="no"
        style={{ top: '70%' }}
      />
    </div>
  )
}

export default DecisionNode