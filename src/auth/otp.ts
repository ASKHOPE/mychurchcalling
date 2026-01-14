import { auth } from './workos';
import { User } from '../types';

export class OTPAuth {
    static async sendOtp(phone: string): Promise<boolean> {
        console.log('📱 Sending OTP to:', phone);
        alert(`Demo Mode: OTP sent to ${phone}\n\nEnter any 6-digit code to continue.`);
        return true;
    }

    static async verifyOtp(code: string, phone: string): Promise<boolean> {
        if (code.length !== 6) return false;

        // Create a guest user session
        const guestUser: User = {
            _id: `guest_${Date.now()}`,
            _creationTime: Date.now(),
            name: 'Guest User',
            email: phone,
            picture: undefined,
            tokenIdentifier: `otp|${phone}`,
            role: 'member',
            lastLoginAt: Date.now(),
        };

        const sessionData = {
            isAuthenticated: true,
            isLoading: false,
            user: guestUser,
            accessToken: `guest_token_${Date.now()}`,
        };

        localStorage.setItem('auth_session', JSON.stringify(sessionData));
        await auth.restoreSession();
        return true;
    }
}
