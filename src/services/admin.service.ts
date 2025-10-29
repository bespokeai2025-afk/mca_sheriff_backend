import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
import { User } from "../entities/User";
import { deleteUserToken, generateTokens } from "../utils/jwtUtils";
import bcrypt from "bcryptjs";


export class AdminService {

    private userRepository = AppDataSource.getRepository(User);
    private adminRepository = AppDataSource.getRepository(Admin);

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

    public async logoutAdmin(id: string, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service')
        }

        let user = null;
        if (verifyUser.admin_exist) {
            user = await this.adminRepository.findOneBy({ id })
        }

        if (!user) {
            return errorWithoutData('admin user not found')
        }

        if (verifyUser.admin_exist.id != user.id) {
            return errorWithoutData('invalid admin user')
        }

        deleteUserToken(user.id);

        await this.adminRepository.save(user);

        return successWithoutData("admin Logout Successfully")

    }


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

        //  compare hashed password
        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) {
            return errorWithoutData("Invalid email or password");
        }

        const { accessToken, refreshToken } = await generateTokens(user);

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





}
