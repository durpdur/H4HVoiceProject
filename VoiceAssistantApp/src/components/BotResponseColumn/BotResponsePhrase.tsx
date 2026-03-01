import { Box, Fade, Typography } from "@mui/material";

type BotResponseResponsePhraseProps = {
    isThinking?: boolean;
    responseText?: string;
};

function BotResponseResponsePhrase({
    isThinking = false,
    responseText = "",
}: BotResponseResponsePhraseProps) {
    const hasText = responseText.trim().length > 0;

    return (
        <Box sx={{ flexGrow: 1 }}>
            {hasText ? (
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
                <Fade in={!hasText} timeout={500}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontStyle: "italic",
                            color: "grey",
                            animation: isThinking ? "pulse 1.8s infinite" : "none",
                            "@keyframes pulse": {
                                "0%": { opacity: 1 },
                                "50%": { opacity: 0.4 },
                                "100%": { opacity: 1 },
                            },
                        }}
                    >
                        {isThinking ? "Thinking..." : "The assistant's response will appear here."}
                    </Typography>
                </Fade>
            )}
        </Box>
    );
}

export default BotResponseResponsePhrase;