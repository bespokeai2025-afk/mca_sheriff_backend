import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
import { User } from "../entities/User";
import { deleteUserToken, generateTokens } from "../utils/jwtUtils";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PasswordReset } from "../entities/PasswordReset";
import dayjs from "dayjs";
import { sendResetPasswordEmail } from "../utils/emailSender";


export class AdminService {

    private userRepository = AppDataSource.getRepository(User);
    private adminRepository = AppDataSource.getRepository(Admin);
    private passwordResetRepo = AppDataSource.getRepository(PasswordReset);

    public async findAdmin(verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');
        }

        const admins = await this.adminRepository.find({ order: { "createdAt": "desc" } })

        return successWithData("all Admin user Data", admins);
    }

    public async findAdminById(id: string, verifyUser: any) {
        try {
            // Ensure only admin can access
            if (!verifyUser || verifyUser.user_exist) {
                return errorWithoutData('Only admin can use this service.');
            }

            const admin = await this.adminRepository.findOneBy({ id });

            if (!admin) {
                return errorWithoutData('Admin user not found.');
            }

            return successWithData('Admin user found successfully.', admin);
        } catch (error: any) {
            console.error('Error fetching admin by ID:', error);
            return errorWithoutData('Failed to fetch admin user.');
        }
    }


    public async createAdmin(data: { [key: string]: any }) {
        // Check if email already exists
        if (data.email) {
            const user_exist = await this.adminRepository.findOneBy({ email: data.email });
            if (user_exist) return errorWithoutData("Email is already registered");
        }

        // Validate password strength
        if (data.password) {
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!strongPasswordRegex.test(data.password)) {
                return errorWithoutData("Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.");
            }

            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(data.password, salt);
        } else {
            return errorWithoutData("Password is required");
        }

        const newAdminUser = await this.adminRepository.create(data);
        const adminUser = await this.adminRepository.save(newAdminUser);

        return successWithData('Admin created successfully', adminUser);
    }


    // public async updateAdmin(id: string, data: { [key: string]: any; }, verifyUser: { [key: string]: any }) {

    //     if (verifyUser.user_exist) {
    //         return errorWithoutData('only admin can use this service.');
    //     }

    //     const admin = await this.adminRepository.findOneBy({ id, isActive: true, isDeleted: false });
    //     if (!admin) {
    //         return errorWithoutData('admin not found')
    //     }

    //     if (data.email) {
    //         const user_exist = await this.adminRepository.findOneBy({ email: data.email });
    //         if (user_exist) return errorWithoutData("can't update email")
    //     }

    //     await this.adminRepository.update(id.toString(), data);

    //     return successWithoutData('admin updated successfully');
    // }

    public async updateAdmin(
        id: string,
        data: { [key: string]: any },
        verifyUser: { [key: string]: any }
    ) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service.');
        }

        const admin = await this.adminRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!admin) {
            return errorWithoutData('Admin not found.');
        }

        const allowedFields = ['name', 'lastName', 'organization', 'mobile'];
        const updateData: any = {};

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return errorWithoutData('No valid fields to update.');
        }

        await this.adminRepository.update(id.toString(), updateData);

        const updatedAdmin = await this.adminRepository.findOneBy({ id });

        return successWithData('Admin updated successfully.', updatedAdmin);
    }

    public async deleteAdmin(id: string, verifyUser: { [key: string]: any }) {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');
        }
        const user = await this.adminRepository.findOneBy({ id, isActive: true, isDeleted: false })

        if (!user) {
            return errorWithoutData('admin not found')
        }
        user.isDeleted = true;
        user.isActive = false;

        deleteUserToken(user.id);
        await this.adminRepository.save(user);

        return successWithoutData("admin deleted Successfully")

    }



    // public async logoutAdmin(id: string, verifyUser: any) {

    //     if (verifyUser.user_exist) {
    //         return errorWithoutData('only admin can use this service')
    //     }

    //     let user = null;
    //     if (verifyUser.admin_exist) {
    //         user = await this.adminRepository.findOneBy({ id })
    //     }

    //     if (!user) {
    //         return errorWithoutData('admin user not found')
    //     }

    //     if (verifyUser.admin_exist.id != user.id) {
    //         return errorWithoutData('invalid admin user')
    //     }

    //     deleteUserToken(user.id);

    //     await this.adminRepository.save(user);

    //     return successWithoutData("admin Logout Successfully")

    // }




    public async logoutAdmin(id: string, verifyUser: any) {
        // Only admin can logout
        if (!verifyUser.admin_exist) {
            return errorWithoutData('Only admin can use this service');
        }

        // Find the admin user
        const user = await this.adminRepository.findOneBy({ id });
        if (!user) {
            return errorWithoutData('Admin user not found');
        }

        // Verify the logged-in admin matches
        if (verifyUser.admin_exist.id !== user.id) {
            return errorWithoutData('Invalid admin user');
        }

        //  Clear session info
        user.isLoggedIn = false;
        user.currentSessionToken = null;

        // Optional: delete refresh tokens or other session data
        deleteUserToken(user.id);

        // Save changes
        await this.adminRepository.save(user);

        return successWithoutData("Admin logout successfully");
    }



    // public async loginAdminWithEmailPassword(data: { email?: string; password?: string }) {
    //     if (!data.email || !data.password) {
    //         return errorWithoutData("Email and password are required");
    //     }

    //     const user = await this.adminRepository.findOneBy({ email: data.email });
    //     if (!user) {
    //         return errorWithoutData("Invalid email or password");
    //     }

    //     if (!user.isActive || user.isDeleted) {
    //         return errorWithoutData("User is not allowed to login");
    //     }

    //     //  compare hashed password
    //     const isMatch = await bcrypt.compare(data.password, user.password);
    //     if (!isMatch) {
    //         return errorWithoutData("Invalid email or password");
    //     }

    //     const { accessToken, refreshToken } = await generateTokens(user);

    //     return successWithData("Login successful", {
    //         id: user.id,
    //         email: user.email,
    //         mobile: user.mobile,
    //          name: user.name,
    //           lastName: user.lastName,
    //         accessToken,
    //         refreshToken,
    //     });
    // }


    public async loginAdminWithEmailPassword(data: { email?: string; password?: string }) {
        if (!data.email || !data.password) {
            return errorWithoutData("Email and password are required");
        }

        const user = await this.adminRepository.findOneBy({ email: data.email });
        if (!user) {
            return errorWithoutData("Invalid email or password");
        }

        if (!user.isActive || user.isDeleted) {
            return errorWithoutData("User is not allowed to login");
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            return errorWithoutData("Invalid email or password");
        }

        //  Prevent multiple sessions
        if (user.isLoggedIn) {
            return errorWithoutData("User is already logged in from another device.");
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user);

        //  Mark user as logged in
        user.isLoggedIn = true;
        user.currentSessionToken = accessToken;
        await this.adminRepository.save(user);

        return successWithData("Login successful", {
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            lastName: user.lastName,
            accessToken,
            refreshToken,
        });
    }




    public async changePassword(
        id: string,
        data: { oldPassword: string; newPassword: string; confirmPassword: string },
        verifyUser: any
    ) {
        try {
            if (verifyUser.user_exist) {
                return errorWithoutData("Only admin can use this service.");
            }

            const admin = await this.adminRepository.findOneBy({ id, isActive: true, isDeleted: false });

            if (!admin) {
                return errorWithoutData("Admin not found");
            }

            // Compare old password
            const isMatch = await bcrypt.compare(data.oldPassword, admin.password);
            if (!isMatch) {
                return errorWithoutData("Old password is incorrect");
            }

            if (data.newPassword !== data.confirmPassword) {
                return errorWithoutData("New password and confirm password do not match");
            }

            // Validate new password strength
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
            if (!strongPasswordRegex.test(data.newPassword)) {
                return errorWithoutData(
                    "New password must be at least 8 characters long, include uppercase, lowercase, number, and special character."
                );
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(data.newPassword, 10);
            admin.password = hashedPassword;
            await this.adminRepository.save(admin);

            return successWithoutData("Password changed successfully");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return errorWithoutData(errorMessage);
        }

    }


    /////////////Reset Password////////////
    // public async requestPasswordReset(email: string) {
    //     if (!email) return errorWithoutData("Email is required");

    //     const admin = await this.adminRepository.findOneBy({ email });
    //     if (!admin) return errorWithoutData("No account found with this email");

    //     // Generate token and expiry (10 minutes)
    //     const token = crypto.randomBytes(20).toString("hex");
    //     const expiresAt = dayjs().add(10, "minute").toDate();

    //     // Save token entry
    //     const resetEntry = this.passwordResetRepo.create({
    //         admin,
    //         token,
    //         expiresAt,
    //     });
    //     await this.passwordResetRepo.save(resetEntry);

    //     // TODO: send token via email (later integration)
    //     console.log(`Password reset token for ${email}: ${token}`);

    //     return successWithoutData("Password reset link sent successfully (check console for token)");
    // }

    public async requestPasswordReset(email: string) {
        if (!email) return errorWithoutData("Email is required");

        const admin = await this.adminRepository.findOneBy({ email });
        if (!admin) return errorWithoutData("No account found with this email");

        // Generate token and expiry (10 minutes)
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = dayjs().add(10, "minute").toDate();

        // Save token
        const resetEntry = this.passwordResetRepo.create({
            admin,
            token,
            expiresAt,
        });
        await this.passwordResetRepo.save(resetEntry);

        //  Generate Reset Link
        const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;

        //  Send Email
        await sendResetPasswordEmail(email, resetLink);

        return successWithoutData("Password reset link sent to your email");
    }

    // STEP 2 - Verify token validity
    public async verifyResetToken(token: string) {
        const entry = await this.passwordResetRepo.findOne({
            where: { token, used: false },
            relations: ["admin"],
        });

        if (!entry) return errorWithoutData("Invalid token");
        if (dayjs().isAfter(entry.expiresAt)) return errorWithoutData("Token has expired");

        return successWithData("Token verified successfully", { adminId: entry.admin.id });
    }

    // STEP 3 - Reset password
    public async resetPassword(token: string, newPassword: string, confirmPassword: string) {
        if (!token || !newPassword || !confirmPassword)
            return errorWithoutData("All fields are required");

        if (newPassword !== confirmPassword)
            return errorWithoutData("New password and confirm password do not match");

        const entry = await this.passwordResetRepo.findOne({
            where: { token, used: false },
            relations: ["admin"],
        });
        if (!entry) return errorWithoutData("Invalid or used token");
        if (dayjs().isAfter(entry.expiresAt)) return errorWithoutData("Token has expired");

        // Validate strong password
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
        if (!strongPasswordRegex.test(newPassword))
            return errorWithoutData(
                "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character."
            );

        // Hash and update password
        const hashed = await bcrypt.hash(newPassword, 10);
        entry.admin.password = hashed;
        await this.adminRepository.save(entry.admin);

        // Mark token used
        entry.used = true;
        await this.passwordResetRepo.save(entry);

        return successWithoutData("Password reset successfully");
    }





}
