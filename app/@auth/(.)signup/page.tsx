import Modal from "@/component/Modal";
import SignupForm from "@/component/SignupForm";

// Intercepts in-app navigation to /signup and shows it as a modal.
// Loading /signup directly renders app/signup/page.tsx instead.
export default function SignupModal() {
  return (
    <Modal labelledBy="signup-title">
      <SignupForm inModal />
    </Modal>
  );
}
