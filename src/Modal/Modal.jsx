export function Modal({children, open}){
    return <dialog open={open}>{children}</dialog>
}