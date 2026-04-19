import Link from 'next/link'

interface MailToButtonProps {
    mailto: string;
    label: string;
}
function MailToButton ({ mailto, label }: MailToButtonProps) {
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