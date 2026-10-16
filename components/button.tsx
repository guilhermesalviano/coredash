interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    ariaLabel?: string;
}

export default function Button({ children, onClick, ariaLabel }: ButtonProps) {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            className="icon-button"
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
            {children}
        </button>
    )
}