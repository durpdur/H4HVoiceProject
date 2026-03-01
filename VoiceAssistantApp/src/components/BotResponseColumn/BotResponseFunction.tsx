import { Box, Button, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { SearchResponse } from "../../types/SearchResponse";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { GenerateResult } from "../../types/GenerateResult";

type BotResponseFunctionProps = {
    searchResponse: SearchResponse | null;
    generatedFunction: GenerateResult | null;
    setGeneratedFunction: React.Dispatch<
        React.SetStateAction<GenerateResult | null>
    >;
    isGenerating?: boolean;
    onGenerate: () => Promise<void>
    searchMs?: number | null
};

function BotResponseFunction({ searchResponse, generatedFunction, setGeneratedFunction, isGenerating, onGenerate, searchMs }: BotResponseFunctionProps) {
    const results = searchResponse?.results ?? [];
    const matched = searchResponse?.matched ?? false;

    if (!searchResponse) {
        return (
            <Box>
                <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
                    Function Match:
                </Typography>
                <Typography variant="body2" sx={{ color: "grey.600", fontStyle: "italic" }}>
                    No search yet.
                </Typography>
            </Box>
        );
    }

    if (!results.length) {
        return (
            <Box>
                <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
                    Function Match:
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                        variant="body2"
                        sx={{ color: "grey.600", fontStyle: "italic", flexGrow: 1 }}
                    >
                        {matched
                            ? "Matched, but no results returned."
                            : "No match found."}
                    </Typography>

                    <Tooltip title="Generate">
                        <Button
                            size="small"
                            variant="contained"
                            endIcon={<AutoAwesomeIcon fontSize="small" />}
                            onClick={onGenerate}
                            disabled={isGenerating}
                            sx={{
                                borderRadius: "999px",
                                textTransform: "none",
                                px: 2,
                                minHeight: 28,
                                fontWeight: 500,
                            }}
                        >
                            Generate
                        </Button>
                    </Tooltip>
                </Stack>
            </Box>
        );
    }

    return (
        <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="left" spacing={1}>
                    <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                        Function Match:
                    </Typography>
                    <Chip
                        size="small"
                        label={matched ? "Matched" : "Not Matched"}
                        color={matched ? "secondary" : "default"}
                        variant={matched ? "filled" : "outlined"}
                    />
                </Stack>
                {typeof searchMs === "number" && (
                    <Chip
                        size="small"
                        label={`${searchMs} ms`}
                        variant="outlined"
                        sx={{
                            fontFamily: "monospace",
                            fontWeight: 500,
                            borderRadius: "999px",
                            bgcolor: "grey.100",
                            color: "text.secondary",
                            borderColor: "divider",
                        }}
                    />
                )}
            </Stack>

            <Stack spacing={1}>
                {results.slice(0, 3).map((r, idx) => {
                    const isTop = idx === 0;

                    return (
                        <Box
                            key={idx}
                            sx={{
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 3,
                                border: isTop ? "2px solid transparent" : "1px solid",
                                borderColor: isTop ? undefined : "divider",
                                background: isTop
                                    ? `
                                          linear-gradient(white, white) padding-box,
                                          linear-gradient(
                                            90deg,
                                            #ff9aa2,
                                            #ffb7b2,
                                            #ffdac1,
                                            #e2f0cb,
                                            #b5ead7,
                                            #c7ceea
                                          ) border-box
                                        `
                                    : "background.default",
                                transition: "all 0.05s ease",
                            }}
                        >
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {r.fd?.function_id ?? "Unnamed function"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {typeof r.confidence === "number"
                                        ? `Confidence: ${Math.round(r.confidence)}%`
                                        : "Confidence: —"}
                                </Typography>
                            </Stack>
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
}

export default BotResponseFunction;