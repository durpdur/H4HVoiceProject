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
    onDeleteFunction: (functionId: string) => Promise<void> | void
    getCardId?: (functionId: string) => string;
    onVisibleFunctionChange?: (functionId: string) => void;
}

function FunctionInterfaceColumn({
    functions,
    onChangeFunction,
    onCreateFunction,
    generatedFunction,
    setGeneratedFunction,
    onDeleteFunction,
    getCardId
}: FunctionInterfaceColumnProps) {
    return (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8, paddingBottom: 30 }}>
            <FunctionInterfaceInput
                onCreate={onCreateFunction}
                generatedFunction={generatedFunction}
                setGeneratedFunction={setGeneratedFunction}
            />

            {functions.map((func, idx) => (
                <div
                    key={func.function_id}
                    id={getCardId?.(func.function_id)}     // ✅ this is what scroll targets
                    style={{ scrollMarginTop: 16 }}        // ✅ avoids getting tucked under headers
                >
                    <FunctionInterface
                        key={func.function_id}
                        functionData={func}
                        onChange={(updated) => onChangeFunction(idx, updated)}
                        onDelete={() => onDeleteFunction(func.function_id)}
                    />
                </div>
            ))}
        </div>
    )
}

export default FunctionInterfaceColumn