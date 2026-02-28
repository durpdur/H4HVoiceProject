import VoiceBubble from "../VoiceBubble/VoiceBubble";
import { Box, Paper, Typography, Fade } from "@mui/material";

type TranscriberProps = {
    isRecording: boolean;
    onToggle: () => void;
    displayText: string;
};

function Transcriber({ isRecording, onToggle, displayText }: TranscriberProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%",
                maxWidth: 500,
                mx: "auto"
            }}
        >
            <VoiceBubble isRecording={isRecording} onToggle={onToggle} />

            <Paper
                elevation={0}
                sx={{
                    mt: 3,
                    p: 3,
                    width: "100%",
                    minHeight: 120,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: isRecording ? "primary.light" : "divider",
                    backgroundColor: isRecording ? "rgba(25, 118, 210, 0.02)" : "background.paper",
                    transition: "all 0.3s ease-in-out",
                    boxShadow: isRecording
                        ? "0 8px 32px rgba(25, 118, 210, 0.1)"
                        : "0 4px 12px rgba(0,0,0,0.05)",
                }}
            >
                <Typography
                    variant="overline"
                    sx={{
                        fontWeight: "bold",
                        color: isRecording ? "primary.light" : "text.secondary",
                        letterSpacing: 1.2
                    }}
                >
                    {isRecording ? "Live Transcript" : "Last Input"}
                </Typography>

                <Box sx={{ mt: 1 }}>
                    {displayText ? (
                        <Typography variant="body1" sx={{ lineHeight: 1.6, color: "text.primary", fontWeight: 500 }}>
                            {displayText}
                        </Typography>
                    ) : (
                        <Fade in={!displayText} timeout={500}>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontStyle: "italic",
                                    color: "grey",
                                    animation: isRecording ? "pulse 2s infinite" : "none",
                                    "@keyframes pulse": {
                                        "0%": { opacity: 1 },
                                        "50%": { opacity: 0.5 },
                                        "100%": { opacity: 1 },
                                    }
                                }}
                            >
                                {isRecording ? "Listening intently..." : "Hold the 'N' key to start speaking"}
                            </Typography>
                        </Fade>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

export default Transcriber;