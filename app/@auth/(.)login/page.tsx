import LoginForm from "@/component/LoginForm";
import Modal from "@/component/Modal";

// Intercepts in-app navigation to /login and shows it as a modal.
// Loading /login directly renders app/login/page.tsx instead.
export default function LoginModal() {
  return (
    <Modal labelledBy="login-title">
      <LoginForm inModal />
    </Modal>
  );
}
