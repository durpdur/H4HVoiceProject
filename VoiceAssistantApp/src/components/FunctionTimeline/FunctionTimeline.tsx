import { Box, Stack, Typography, ButtonBase, Chip } from "@mui/material";

export interface FunctionDescriptor {
    function_id: string;
    function_desc: string;
    regex_phrases: string[];
    logic: string;
    response_phrase: string;
    slots?: Record<string, string>;
    metadata: {
        confidence_score: number;
        usage_count: number;
    };
}

type FunctionTimelineProps = {
    functions: FunctionDescriptor[];
    activeId?: string;
    onSelect: (functionId: string) => void;
};

export function FunctionTimeline({ functions, activeId, onSelect }: FunctionTimelineProps) {
    return (
        <Box
            sx={{
                width: 320,
                flexShrink: 0,
                pr: 2,
                borderRight: "1px solid",
                borderColor: "divider",
                overflowY: "auto",
            }}
        >
            <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.8 }}>
                Functions
            </Typography>

            <Stack spacing={1.25}>
                {functions.map((fn, idx) => {
                    const isActive = fn.function_id === activeId;
                    return (
                        <ButtonBase
                            key={fn.function_id}
                            onClick={() => onSelect(fn.function_id)}
                            style={{ textAlign: "left", width: "100%" }}
                        >
                            <Box
                                sx={{
                                    width: "100%",
                                    display: "grid",
                                    gridTemplateColumns: "18px 1fr",
                                    columnGap: 1.5,
                                    alignItems: "start",
                                    px: 1.25,
                                    py: 1,
                                    borderRadius: 2,
                                    transition: "background 160ms ease",
                                    ...(isActive && { bgcolor: "action.selected" }),
                                    "&:hover": { bgcolor: "action.hover" },
                                }}
                            >
                                {/* Rail + Dot */}
                                <Box sx={{ position: "relative", height: "100%" }}>
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: "8px",
                                            top: idx === 0 ? 10 : 0,
                                            bottom: idx === functions.length - 1 ? "calc(100% - 10px)" : 0,
                                            width: "2px",
                                            bgcolor: "divider",
                                            borderRadius: 999,
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: "relative",
                                            mt: "2px",
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            bgcolor: isActive ? "primary.main" : "background.paper",
                                            border: "2px solid",
                                            borderColor: isActive ? "primary.main" : "divider",
                                            boxShadow: isActive ? 3 : 0,
                                        }}
                                    />
                                </Box>

                                {/* Text */}
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                            {fn.function_desc || fn.function_id}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                                        <Chip size="small" label={`conf ${fn.metadata.confidence_score.toFixed(2)}`} />
                                        <Chip size="small" label={`used ${fn.metadata.usage_count}`} />
                                        <Chip size="small" label={`${fn.regex_phrases.length} regex`} />
                                    </Stack>
                                </Box>
                            </Box>
                        </ButtonBase>
                    );
                })}
            </Stack>
        </Box>
    );
}