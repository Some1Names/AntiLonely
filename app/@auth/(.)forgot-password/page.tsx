import ForgotPasswordForm from "@/component/ForgotPasswordForm";
import Modal from "@/component/Modal";

// Intercepts in-app navigation to /forgot-password (the login form's
// "ลืมรหัสผ่าน?") and shows it as a modal, morphing from the login sheet.
// Loading /forgot-password directly renders app/forgot-password/page.tsx.
export default function ForgotPasswordModal() {
  return (
    <Modal labelledBy="forgot-title">
      <ForgotPasswordForm inModal />
    </Modal>
  );
}
