import { Box, Paper, Typography, Fade } from "@mui/material";

type BotResponseColumnProps = {
    responseText?: string;
    isThinking?: boolean;
};

function BotResponseColumn({
    responseText,
    isThinking = false,
}: BotResponseColumnProps) {
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

            <Box sx={{ mt: 1, flexGrow: 1 }}>
                {responseText ? (
                    <Typography
                        variant="body1"
                        sx={{
                            lineHeight: 1.7,
                            color: "text.primary",
                        }}
                    >
                        {responseText}
                    </Typography>
                ) : (
                    <Fade in={!responseText} timeout={500}>
                        <Typography
                            variant="body1"
                            sx={{
                                fontStyle: "italic",
                                color: "grey",
                                animation: isThinking
                                    ? "pulse 1.8s infinite"
                                    : "none",
                                "@keyframes pulse": {
                                    "0%": { opacity: 1 },
                                    "50%": { opacity: 0.4 },
                                    "100%": { opacity: 1 },
                                },
                            }}
                        >
                            {isThinking
                                ? "Thinking..."
                                : "The assistant's response will appear here."}
                        </Typography>
                    </Fade>
                )}
            </Box>
        </Paper>
    );
}

export default BotResponseColumn;