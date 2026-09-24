import Store from "@/src/core/store/store";
import { loginApiService, LoginApiService } from "@/src/core/services/client/login-api.service";
import { basePathService } from "@/src/core/services/client/basePath.service";
import type { LoginPageState } from "@/src/core/models/login";

const INITIAL_LOGIN_STATE: LoginPageState = { userInv: "", password: "", isSubmitting: false, error: "" };

export class LoginController extends Store<LoginPageState> {
  constructor(private readonly service: LoginApiService) {
    super({ ...INITIAL_LOGIN_STATE });
  }

  protected async load() {}

  setUserInv = (userInv: string) => this.setState({ userInv, error: "" });
  setPassword = (password: string) => this.setState({ password, error: "" });

  submit = async () => {
    if (this.state.isSubmitting) return;

    const userInv = this.state.userInv.trim();
    if (!userInv || !this.state.password) {
      this.setState({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
      return;
    }

    this.setState({ isSubmitting: true, error: "" });
    try {
      await this.service.login(userInv, this.state.password);
      window.location.href = basePathService.withBasePath("/");
    } catch (error) {
      this.setState({
        isSubmitting: false,
        error: error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ",
      });
    }
  };
}

export const loginStore = new LoginController(loginApiService);
