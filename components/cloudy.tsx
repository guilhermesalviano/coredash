export default function CloudySVG() {
    return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
            <ellipse cx="44" cy="48" rx="24" ry="13" fill="#7a9bb5" opacity="0.8" />
            <ellipse cx="30" cy="50" rx="16" ry="11" fill="#8daec5" opacity="0.85" />
            <ellipse cx="38" cy="40" rx="18" ry="13" fill="#a8c4d8" />
            <ellipse cx="52" cy="43" rx="14" ry="12" fill="#bcd3e6" />
            <ellipse cx="43" cy="37" rx="13" ry="12" fill="#cde0ed" />
            {/* <polygon points="45,50 38,63 43,61 39,76 50,58 44,60" fill="#f5d44a" opacity="0.95">
                <animate attributeName="opacity" values="0.95;0.3;0.95;0.3;0.95" dur="4s" repeatCount="indefinite"/>
            </polygon> */}
        </svg>
    );
}