import { Box, Tooltip } from "@mui/material";
import type { FunctionDescriptor } from "../../types/FunctionDescriptor";

type Props = {
    functions: FunctionDescriptor[];
    activeId?: string;
    onSelect: (functionId: string) => void;
};

export default function FunctionTimelineSlim({
    functions,
    activeId,
    onSelect,
}: Props) {
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                py: 2,
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    width: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                {/* Vertical line */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        width: 2,
                        bgcolor: "divider",
                        borderRadius: 999,
                    }}
                />

                {functions.map((fn) => {
                    const isActive = fn.function_id === activeId;

                    return (
                        <Tooltip
                            key={fn.function_id}
                            title={fn.function_id}
                            placement="right"
                            arrow
                        >
                            <Box
                                onClick={() => onSelect(fn.function_id)}
                                sx={{
                                    position: "relative",
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    zIndex: 1,

                                    bgcolor: isActive
                                        ? "primary.main"
                                        : "background.paper",

                                    border: "2px solid",
                                    borderColor: isActive
                                        ? "primary.main"
                                        : "divider",

                                    transition: "all 0.2s ease",

                                    "&:hover": {
                                        transform: "scale(1.3)",
                                        borderColor: "primary.main",
                                    },
                                }}
                            />
                        </Tooltip>
                    );
                })}
            </Box>
        </Box>
    );
}