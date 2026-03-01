import { Box, Paper, Typography } from "@mui/material";
import { SearchResponse } from "../../types/SearchResponse";
import BotResponseFunction from "./BotResponseFunction";
import BotResponseResponsePhrase from "./BotResponsePhrase";

type BotResponseColumnProps = {
    isThinking: boolean;
    searchResponse: SearchResponse | null;
};

function BotResponseColumn({ isThinking = false, searchResponse }: BotResponseColumnProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                mt: 3,
                p: 3,
                width: "100%",
                flex: 0.9,
                borderRadius: 4,
                border: "1px solid",
                borderColor: isThinking ? "secondary.light" : "divider",
                backgroundColor: isThinking
                    ? "rgba(156, 39, 176, 0.02)"
                    : "background.paper",
                transition: "all 0.3s ease-in-out",
                boxShadow: isThinking
                    ? "0 8px 32px rgba(156, 39, 176, 0.08)"
                    : "0 4px 12px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Typography
                variant="overline"
                sx={{
                    fontWeight: "bold",
                    color: isThinking ? "secondary.light" : "text.secondary",
                    letterSpacing: 1.2,
                }}
            >
                Assistant Response
            </Typography>

            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
                <BotResponseFunction searchResponse={searchResponse} />
                <BotResponseResponsePhrase
                    isThinking={isThinking}
                    responseText={searchResponse?.results[0]?.fd?.response_phrase ?? ""}
                />
            </Box>
        </Paper>
    );
}

export default BotResponseColumn;