import type { FunctionDescriptor } from "../../types/FunctionDescriptor"
import FunctionInterface from "../FunctionInterface/FunctionInterface"
import FunctionInterfaceInput from "../FunctionInterfaceInput/FunctionInterfaceInput"

type FunctionInterfaceColumnProps = {
    functions: FunctionDescriptor[]
    onChangeFunction: (index: number, updated: FunctionDescriptor) => void
    onCreateFunction: (fd: FunctionDescriptor) => Promise<void> | void
    onRefresh: () => Promise<void> | void
}

function FunctionInterfaceColumn({
    functions,
    onChangeFunction,
    onCreateFunction
}: FunctionInterfaceColumnProps) {
    return (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8, paddingBottom: 30 }}>
            <FunctionInterfaceInput onCreate={onCreateFunction} />

            {functions.map((func, idx) => (
                <FunctionInterface
                    key={func.function_id}
                    functionData={func}
                    onChange={(updated) => onChangeFunction(idx, updated)}
                />
            ))}
        </div>
    )
}

export default FunctionInterfaceColumn