import styles from "./VoiceBubble.module.css";

type VoiceBubbleProps = {
    isRecording: boolean;
    onToggle: () => void;
};

export default function VoiceBubble({ isRecording, onToggle }: VoiceBubbleProps) {
    return (
        <div className={styles.wrapper}>
            {/* Pulse ring */}
            <div
                className={`${styles.ring} ${isRecording ? styles.activeRing : ""
                    }`}
            />


            <div
                className={`${styles.voice} ${isRecording ? styles.active : ""
                    }`}
            >
                <span className={styles.bar} />
                <span className={styles.bar} />
                <span className={styles.bar} />
                <span className={styles.bar} />
                <span className={styles.bar} />
            </div>
        </div>
    );
}