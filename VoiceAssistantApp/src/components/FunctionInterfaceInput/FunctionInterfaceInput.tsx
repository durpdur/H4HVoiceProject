import { useEffect, useState } from "react"
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
    Collapse,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { GenerateResult } from "../../types/GenerateResult"

type Props = {
    onCreate: (fd: FunctionDescriptor) => Promise<void> | void
    generatedFunction: GenerateResult | null
    setGeneratedFunction: React.Dispatch<
        React.SetStateAction<GenerateResult | null>
    >
}

const emptyFunction = (): FunctionDescriptor => ({
    function_id: "",
    function_desc: "",
    regex_phrases: [""],
    logic: "",
    response_phrase: "",
    slots: {},
    metadata: { confidence_score: 0.9, usage_count: 0 },
})

// Normalizes object
const normalizeDescriptor = (fd: FunctionDescriptor): FunctionDescriptor => ({
    ...emptyFunction(),
    ...fd,
    regex_phrases:
        fd.regex_phrases && fd.regex_phrases.length ? fd.regex_phrases : [""],
    slots: fd.slots ?? {},
})

export default function FunctionInterfaceInput({
    onCreate,
    generatedFunction,
    setGeneratedFunction,
}: Props) {
    // collapsed state
    const [collapsed, setCollapsed] = useState<boolean>(false)

    // Hydrates component when generatedFunction has something
    useEffect(() => {
        if (!generatedFunction) return

        // Autofill the form from the generated descriptor
        setDraft(normalizeDescriptor(generatedFunction.descriptor))
        // Expand the form when a generated function arrives so user can review/edit it
        setCollapsed(false)
    }, [generatedFunction])

    const [draft, setDraft] = useState<FunctionDescriptor>(emptyFunction())
    const slots: Record<string, string> = draft.slots ?? {}

    const setField = <K extends keyof FunctionDescriptor>(key: K, value: FunctionDescriptor[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }))
    }

    // regex helpers
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

    // slots helpers
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

    const canSave =
        draft.function_id.trim().length > 0 &&
        draft.function_desc.trim().length > 0 &&
        draft.logic.trim().length > 0 &&
        draft.response_phrase.trim().length > 0

    const handleSave = async () => {
        if (!canSave) return
        // optional cleanup: remove empty regex lines
        const cleaned: FunctionDescriptor = {
            ...draft,
            regex_phrases: draft.regex_phrases.map((s) => s.trim()).filter(Boolean),
        }
        await onCreate(cleaned)
        setDraft(emptyFunction())
        setGeneratedFunction(null)
    }

    const handleCancel = () => {
        setDraft(emptyFunction())
        setGeneratedFunction(null)
    }

    const toggleCollapsed = () => setCollapsed((c) => !c)

    return (
        <Paper
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                border: "2px solid transparent",
                background: `
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
    `,
            }}
        >
            <Stack spacing={2}>
                {/* Header row: always visible */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    onClick={toggleCollapsed}
                    sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        "&:hover": { opacity: 0.95 },
                        pr: 1,
                    }}
                    aria-expanded={!collapsed}
                >
                    <Stack direction="row" justifyContent="left" alignItems="center" spacing={1}>
                        <Typography variant="h6" paddingRight={"0.5em"}>
                            New Function:
                        </Typography>
                        <Chip label="Draft" size="small" color="success" variant="outlined" />
                    </Stack>

                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleCollapsed()
                        }}
                        aria-label={collapsed ? "Expand function input" : "Collapse function input"}
                        aria-expanded={!collapsed}
                    >
                        <ExpandMoreIcon
                            sx={{
                                transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
                                transition: "transform 200ms ease-in-out",
                            }}
                        />
                    </IconButton>
                </Stack>

                <Divider />

                {/* Collapsible content */}
                <Collapse in={!collapsed} timeout="auto" unmountOnExit>
                    <Stack spacing={2}>
                        <TextField
                            label="function_id"
                            value={draft.function_id}
                            onChange={(e) => setField("function_id", e.target.value)}
                            fullWidth
                            placeholder="e.g. kettle_on_002"
                        />

                        <TextField
                            label="function_desc (embedded)"
                            value={draft.function_desc}
                            onChange={(e) => setField("function_desc", e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                        />

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
                                        <Stack
                                            key={key}
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={1}
                                            alignItems="center"
                                        >
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

                        <TextField
                            label="response_phrase"
                            value={draft.response_phrase}
                            onChange={(e) => setField("response_phrase", e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                        />

                        <Stack direction="row" spacing={2} justifyContent="flex-start">
                            <Button variant="contained" color="success" disabled={!canSave} onClick={handleSave}>
                                Save
                            </Button>
                            <Button variant="outlined" color="warning" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </Stack>

                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            Only <b>function_desc</b> is embedded; everything else is stored as metadata.
                        </Typography>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    )
}