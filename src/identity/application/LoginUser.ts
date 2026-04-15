import type { FirebaseAuthAdapter } from "../infrastructure/FirebaseAuthAdapter"
import type { User } from "../domain/User"

export class LoginUser {
  private authAdapter: FirebaseAuthAdapter

  constructor(authAdapter: FirebaseAuthAdapter) {
    this.authAdapter = authAdapter
  }

  async execute(email: string, password: string): Promise<User> {
    return this.authAdapter.signIn(email, password)
  }
}
