import type { FunctionDescriptor } from "../../types/FunctionDescriptor"
import { Button } from "@mui/material"
import FunctionInterface from "../FunctionInterface/FunctionInterface"
import FunctionInterfaceInput from "../FunctionInterfaceInput/FunctionInterfaceInput"

type FunctionInterfaceColumnProps = {
    functions: FunctionDescriptor[]
    onChangeFunction: (index: number, updated: FunctionDescriptor) => void
    onCreateFunction: (fd: FunctionDescriptor) => Promise<void> | void
    onAddKettle: () => Promise<void> | void
    onRefresh: () => Promise<void> | void
}

function FunctionInterfaceColumn({
    functions,
    onChangeFunction,
    onCreateFunction,
    onAddKettle,
    onRefresh,
}: FunctionInterfaceColumnProps) {
    return (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
            <FunctionInterfaceInput onCreate={onCreateFunction} />

            {functions.map((func, idx) => (
                <FunctionInterface
                    key={func.function_id}
                    functionData={func}
                    onChange={(updated) => onChangeFunction(idx, updated)}
                />
            ))}

            <Button fullWidth onClick={onAddKettle}>
                Add kettle function
            </Button>
            <Button fullWidth onClick={onRefresh}>
                Refresh from DB
            </Button>
        </div>
    )
}

export default FunctionInterfaceColumn