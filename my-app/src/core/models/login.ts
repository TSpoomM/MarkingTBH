export type LoginPageState = {
  userInv: string;
  password: string;
  isSubmitting: boolean;
  error: string;
};

export type LoginFormProps = {
  userInv: string;
  password: string;
  isSubmitting: boolean;
  error: string;
  onUserInvChange: (userInv: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
};
