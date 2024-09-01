import Link from 'next/link'
function MailToButton ({ mailto, label }) {
    return (
        <Link
            href="#"
            onClick={(e) => {
                window.location.href = mailto;
                e.preventDefault();
            }}
        >
            {label}
        </Link>
    );
};

export default MailToButton;