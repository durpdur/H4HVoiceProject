import type { FunctionDescriptor } from "../../types/FunctionDescriptor"
import { GenerateResult } from "../../types/GenerateResult"
import FunctionInterface from "../FunctionInterface/FunctionInterface"
import FunctionInterfaceInput from "../FunctionInterfaceInput/FunctionInterfaceInput"

type FunctionInterfaceColumnProps = {
    functions: FunctionDescriptor[]
    onChangeFunction: (index: number, updated: FunctionDescriptor) => void
    onCreateFunction: (fd: FunctionDescriptor) => Promise<void> | void
    onRefresh: () => Promise<void> | void
    generatedFunction: GenerateResult | null
    setGeneratedFunction: React.Dispatch<
        React.SetStateAction<GenerateResult | null>
    >
}

function FunctionInterfaceColumn({
    functions,
    onChangeFunction,
    onCreateFunction,
    generatedFunction,
    setGeneratedFunction
}: FunctionInterfaceColumnProps) {
    return (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8, paddingBottom: 30 }}>
            <FunctionInterfaceInput
                onCreate={onCreateFunction}
                generatedFunction={generatedFunction}
                setGeneratedFunction={setGeneratedFunction}
            />

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