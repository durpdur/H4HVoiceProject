import { useMemo, useState } from "react";
import type { FunctionDescriptor } from "../../types/FunctionDescriptor";

import {
    Box,
    Stack,
    Paper,
    Typography,
    TextField,
    Divider,
    Chip,
    IconButton,
    Tooltip,
    Button
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

type Props = {
    functionData: FunctionDescriptor;
    onChange: (updated: FunctionDescriptor) => void;
};

function FunctionInterface({ functionData, onChange }: Props) {
    const [draft, setDraft] = useState<FunctionDescriptor>(functionData);
    const slots: Record<string, string> = draft.slots ?? {};

    // Keep draft in sync if parent changes (e.g., switching selection)
    useMemo(() => {
        setDraft(functionData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [functionData]);

    const commit = (next: FunctionDescriptor) => {
        setDraft(next);
        onChange(next);
    };

    // ---------- Basic field helpers ----------
    const setField = <K extends keyof FunctionDescriptor>(key: K, value: FunctionDescriptor[K]) => {
        commit({ ...draft, [key]: value });
    };

    // ---------- regex_phrases editor ----------
    const addRegexPhrase = () => setField("regex_phrases", [...draft.regex_phrases, ""]);
    const updateRegexPhrase = (i: number, value: string) => {
        const next = [...draft.regex_phrases];
        next[i] = value;
        setField("regex_phrases", next);
    };
    const removeRegexPhrase = (i: number) => {
        const next = draft.regex_phrases.filter((_, idx) => idx !== i);
        setField("regex_phrases", next);
    };

    // ---------- slots editor (Record<string, string>) ----------
    const setSlotKeyValue = (key: string, value: string) => {
        setField("slots", { ...draft.slots, [key]: value });
    };

    const renameSlotKey = (oldKey: string, newKey: string) => {
        if (!newKey) return;

        const { [oldKey]: oldVal, ...rest } = slots;
        setField("slots", { ...rest, [newKey]: oldVal ?? "" });
    };

    const removeSlotKey = (key: string) => {
        const { [key]: _, ...rest } = slots;
        setField("slots", rest);
    };

    const addSlot = () => {
        let k = "slot";
        let n = 1;
        while ((k + n) in slots) n++;
        setField("slots", { ...slots, [k + n]: "" });
    };

    // ---------- metadata editor ----------
    const setMetadata = (patch: Partial<FunctionDescriptor["metadata"]>) => {
        setField("metadata", { ...draft.metadata, ...patch });
    };

    const slotEntries = Object.entries(draft.slots ?? {});

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="left" alignItems="center">
                    <Typography variant="h6" paddingRight={"0.5em"}>Function:</Typography>
                    <Chip label={draft.function_id} size="small" />
                </Stack>

                <Divider />

                {/* function_desc */}
                <TextField
                    label="function_desc"
                    value={draft.function_desc}
                    onChange={(e) => setField("function_desc", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                />

                {/* logic */}
                <Box>
                    <Typography variant="subtitle1">logic</Typography>
                    <TextField
                        value={draft.logic}
                        onChange={(e) => setField("logic", e.target.value)}
                        fullWidth
                        multiline
                        minRows={6}
                        variant="outlined"
                        placeholder="// Write logic here..."
                        spellCheck={false}
                        sx={{
                            "& .MuiInputBase-root": {
                                fontFamily: "monospace",
                                fontSize: 13,
                                lineHeight: 1.6,
                                backgroundColor: "#0f172a",
                                color: "#e2e8f0",
                                borderRadius: 2,
                            },
                        }}
                    />
                </Box>


                {/* regex_phrases */}
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1">regex_phrases</Typography>
                        <Tooltip title="Add phrase">
                            <IconButton onClick={addRegexPhrase} size="small">
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Stack spacing={1}>
                        {draft.regex_phrases.map((phrase, i) => (
                            <Stack key={i} direction="row" spacing={1} alignItems="center">
                                <TextField
                                    label={`phrase ${i + 1}`}
                                    value={phrase}
                                    onChange={(e) => updateRegexPhrase(i, e.target.value)}
                                    fullWidth
                                />
                                <Tooltip title="Remove">
                                    <IconButton onClick={() => removeRegexPhrase(i)} size="small">
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        ))}
                    </Stack>
                </Box>

                {/* slots */}
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle1">slots</Typography>
                        <Tooltip title="Add slot">
                            <IconButton onClick={addSlot} size="small">
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    {slotEntries.length === 0 ? (
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                            No slots
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {slotEntries.map(([key, val]) => (
                                <Stack key={key} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                                    <TextField
                                        label="key"
                                        value={key}
                                        onChange={(e) => renameSlotKey(key, e.target.value)}
                                        sx={{ minWidth: 180 }}
                                    />
                                    <TextField
                                        label="value"
                                        value={val}
                                        onChange={(e) => setSlotKeyValue(key, e.target.value)}
                                        fullWidth
                                    />
                                    <Tooltip title="Remove">
                                        <IconButton onClick={() => removeSlotKey(key)} size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                </Box>

                {/* metadata */}
                <Box sx={{ mt: 2 }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                    >
                        <Typography variant="subtitle1">
                            Usage Count:
                        </Typography>

                        <Chip
                            label={draft.metadata.usage_count}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Stack>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="flex-start" sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        color="success"
                    >
                        Save
                    </Button>

                    <Button
                        variant="outlined"
                        color="warning"
                    >
                        Cancel
                    </Button>
                </Stack>

                {/* response_phrase */}
                <TextField
                    label="response_phrase"
                    value={draft.response_phrase}
                    onChange={(e) => setField("response_phrase", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                />

            </Stack>
        </Paper >
    );
}

export default FunctionInterface;