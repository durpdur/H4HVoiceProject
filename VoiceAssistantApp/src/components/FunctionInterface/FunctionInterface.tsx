import { useEffect, useMemo, useState } from "react"
import type { FunctionDescriptor } from "../../types/FunctionDescriptor"

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
    Button,
} from "@mui/material"

import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"

type Props = {
    functionData: FunctionDescriptor
    onChange: (updated: FunctionDescriptor) => void
    onDelete: () => Promise<void> | void
}

function FunctionInterface({ functionData, onChange, onDelete }: Props) {
    const [draft, setDraft] = useState<FunctionDescriptor>(functionData)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const slots: Record<string, string> = draft.slots ?? {}

    const handleDelete = async () => {
        setIsDeleting(true)
        setSaveError(null)
        try {
            await onDelete()
        } catch (e: any) {
            console.error(e)
            setSaveError(e?.message ?? "Failed to delete")
            setIsDeleting(false) // keep card visible if delete failed
        }
    }

    // Keep draft in sync if parent changes (e.g. after refresh/listFunctions)
    useEffect(() => {
        setDraft(functionData)
        setSaveError(null)
    }, [functionData])

    // Detect unsaved changes
    const isDirty = useMemo(() => {
        return JSON.stringify(draft) !== JSON.stringify(functionData)
    }, [draft, functionData])

    // ---------- Basic field helpers ----------
    const setField = <K extends keyof FunctionDescriptor>(key: K, value: FunctionDescriptor[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }))
    }

    // ---------- regex_phrases editor ----------
    const addRegexPhrase = () => setField("regex_phrases", [...draft.regex_phrases, ""])
    const updateRegexPhrase = (i: number, value: string) => {
        const next = [...draft.regex_phrases]
        next[i] = value
        setField("regex_phrases", next)
    }
    const removeRegexPhrase = (i: number) => {
        const next = draft.regex_phrases.filter((_, idx) => idx !== i)
        setField("regex_phrases", next.length ? next : [""])
    }

    // ---------- slots editor ----------
    const setSlotKeyValue = (key: string, value: string) => {
        setField("slots", { ...(draft.slots ?? {}), [key]: value })
    }

    const renameSlotKey = (oldKey: string, newKey: string) => {
        if (!newKey) return
        const { [oldKey]: oldVal, ...rest } = slots
        setField("slots", { ...rest, [newKey]: oldVal ?? "" })
    }

    const removeSlotKey = (key: string) => {
        const { [key]: _, ...rest } = slots
        setField("slots", rest)
    }

    const addSlot = () => {
        let k = "slot"
        let n = 1
        while ((k + n) in slots) n++
        setField("slots", { ...slots, [k + n]: "" })
    }

    const slotEntries = Object.entries(draft.slots ?? {})

    // ---------- Save / Cancel ----------
    const handleSave = async () => {
        setIsSaving(true)
        setSaveError(null)

        try {
            // optional cleanup
            const cleaned: FunctionDescriptor = {
                ...draft,
                function_id: draft.function_id.trim(),
                function_desc: draft.function_desc.trim(),
                regex_phrases: draft.regex_phrases.map((s) => s.trim()).filter(Boolean),
                response_phrase: draft.response_phrase.trim(),
                slots: draft.slots ?? {},
            }

            if (!cleaned.function_id || !cleaned.function_desc) {
                throw new Error("function_id and function_desc are required")
            }

            await window.chromaAPI.upsertFunction(cleaned)

            // update parent so UI reflects persisted state
            onChange(cleaned)

            // keep draft aligned with what we saved
            setDraft(cleaned)
        } catch (e: any) {
            console.error(e)
            setSaveError(e?.message ?? "Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setDraft(functionData)
        setSaveError(null)
    }

    const statusChip = (() => {
        if (isSaving) return <Chip label="Saving..." size="small" color="info" />
        if (saveError) return <Chip label="Error" size="small" color="error" />
        if (isDirty) return <Chip label="Unsaved" size="small" color="warning" />
        return <Chip label="Saved" size="small" color="primary" />
    })()

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" justifyContent="left" alignItems="center">
                        <Typography variant="h6" paddingRight={"0.5em"}>
                            Function:
                        </Typography>
                        <Chip label={draft.function_id} size="small" />
                    </Stack>

                    {statusChip}
                </Stack>

                <Divider />

                {/* function_desc (embedded) */}
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
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Typography variant="subtitle1">Usage Count:</Typography>
                        <Chip label={draft.metadata.usage_count} size="small" color="primary" variant="outlined" />
                    </Stack>
                </Box>

                {/* response_phrase */}
                <TextField
                    label="response_phrase"
                    value={draft.response_phrase}
                    onChange={(e) => setField("response_phrase", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                />

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={2} justifyContent="flex-start">
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                        >
                            Save
                        </Button>
                        <Button variant="outlined" color="warning" onClick={handleCancel} disabled={!isDirty || isSaving}>
                            Cancel
                        </Button>
                    </Stack>

                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDelete}
                        disabled={isSaving || isDeleting}
                        startIcon={<DeleteIcon />}
                        size="small"
                    >
                        Delete
                    </Button>

                    {saveError && (
                        <Typography variant="body2" color="error" sx={{ alignSelf: "center" }}>
                            {saveError}
                        </Typography>
                    )}
                </Stack>
            </Stack>
        </Paper>
    )
}

export default FunctionInterface