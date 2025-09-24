// import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
// import { AppDataSource } from "../config/database";
// import { Admin } from "../entities/Admin";
// import { User } from "../entities/User";
// import { deleteUserToken, generateTokens } from "../utils/jwtUtils";

// export class AdminService {

//     private userRepository = AppDataSource.getRepository(User);
//     private adminRepository = AppDataSource.getRepository(Admin);
//     public async findAdmin( verifyUser: any) {

//         if (verifyUser.user_exist) {
//             return errorWithoutData('only admin can use this service.');
//         }

//         const admins = await this.adminRepository.find({ order: { "createdAt": "desc" } })

//         return successWithData("all Admin user Data", admins);
//     }

//     public async findAdminById(id: string, verifyUser: { [key: string]: any }) {

//         if (verifyUser.user_exist) {
//             return errorWithoutData('only admin can use this service.');
//         }

//         const admin = await this.adminRepository.findOneBy({ id })

//         if (!admin) {
//             return errorWithoutData('admin user not found')
//         }

//         if (!admin.is_otp_verified) {
//             return errorWithoutData('admin OTP not verified')
//         }

//         return successWithData("Admin user found", admin);
//     }



//     public async createAdmin(data: { [key: string]: any  }) {

//         // if (verifyUser.user_exist) {
//         //     return errorWithoutData('only admin can use this service.');
//         // }

//         if (data.mobile) {
//             const user_exist = await this.adminRepository.findOneBy({ mobile: data.mobile });
//             if (user_exist) return errorWithoutData("mobile number is already registered")
//         }
//         const newAdminUser = await this.adminRepository.create(data);
//         const adminUser = await this.adminRepository.save(newAdminUser)
//         return successWithData('admin Created successfully', adminUser);

//     }

//     public async updateAdmin(id: string, data: { [key: string]: any; }, verifyUser: { [key: string]: any }) {

//         if (verifyUser.user_exist) {
//             return errorWithoutData('only admin can use this service.');
//         }

//         const admin = await this.adminRepository.findOneBy({ id, isActive: true, isDeleted: false });
//         if (!admin) {
//             return errorWithoutData('admin not found')
//         }

//         if (data.mobile) {
//             const user_exist = await this.adminRepository.findOneBy({ mobile: data.mobile });
//             if (user_exist) return errorWithoutData("can't update mobile number")
//         }

//         await this.adminRepository.update(id.toString(), data);

//         return successWithoutData('admin updated successfully');
//     }

//     public async deleteAdmin(id: string, verifyUser: { [key: string]: any }) {


//         if (verifyUser.user_exist) {
//             return errorWithoutData('only admin can use this service.');
//         }
//         const user = await this.adminRepository.findOneBy({ id, isActive: true, isDeleted: false })

//         if (!user) {
//             return errorWithoutData('admin not found')
//         }
//         user.isDeleted = true;
//         user.isActive = false;

//         deleteUserToken(user.id);
//         await this.adminRepository.save(user);

//         return successWithoutData("admin deleted Successfully")

//     }

//     public async logoutAdmin(id: string, verifyUser: any) {

//         if (verifyUser.user_exist) {
//             return errorWithoutData('only admin can use this service')
//         }

//         let user = null;
//         if (verifyUser.admin_exist) {
//             user = await this.adminRepository.findOneBy({ id })
//         }

//         if (!user) {
//             return errorWithoutData('admin user not found')
//         }

//         if (verifyUser.admin_exist.id != user.id) {
//             return errorWithoutData('invalid admin user')
//         }


//         deleteUserToken(user.id);

//         await this.adminRepository.save(user);

//         return successWithoutData("admin Logout Successfully")

//     }
    
// public async loginAdminWithEmailPassword(data: { email?: string; password?: string }) {
//   // Validate input
//   if (!data.email || !data.password) {
//     return errorWithoutData("Email and password are required");
//   }

//   // Check if user exists
//   const user = await this.adminRepository.findOneBy({ email: data.email });
//   if (!user) {
//     return errorWithoutData("Invalid email or password");
//   }

//   // Check if active and not deleted
//   if (!user.isActive || user.isDeleted) {
//     return errorWithoutData("User is not allowed to login");
//   }

//   // Compare plain text passwords
//   if (user.password !== data.password) {
//     return errorWithoutData("Invalid email or password");
//   }

//   // Generate tokens
//   const { accessToken, refreshToken } = await generateTokens(user);

//   const responseData = {
//     id: user.id,
//     email: user.email,
//     mobile: user.mobile,
//     accessToken,
//     refreshToken,
//   };

//   return successWithData("Login successful", responseData);
// }

// }



import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";
import { User } from "../entities/User";
import { deleteUserToken, generateTokens } from "../utils/jwtUtils";

export class AdminService {

    private userRepository = AppDataSource.getRepository(User);
    private adminRepository = AppDataSource.getRepository(Admin);

    public async findAdmin( verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');
        }

        const admins = await this.adminRepository.find({ order: { "createdAt": "desc" } })

        return successWithData("all Admin user Data", admins);
    }

    public async findAdminById(id: string, verifyUser: { [key: string]: any }) {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');
        }

        const admin = await this.adminRepository.findOneBy({ id })

        if (!admin) {
            return errorWithoutData('admin user not found')
        }

        if (!admin.is_otp_verified) {
            return errorWithoutData('admin OTP not verified')
        }

        return successWithData("Admin user found", admin);
    }

    public async createAdmin(data: { [key: string]: any  }) {

        // if (verifyUser.user_exist) {
        //     return errorWithoutData('only admin can use this service.');
        // }

        if (data.email) {
            const user_exist = await this.adminRepository.findOneBy({ email: data.email });
            if (user_exist) return errorWithoutData("email is already registered")
        }
        const newAdminUser = await this.adminRepository.create(data);
        const adminUser = await this.adminRepository.save(newAdminUser)
        return successWithData('admin Created successfully', adminUser);

    }

    public async updateAdmin(id: string, data: { [key: string]: any; }, verifyUser: { [key: string]: any }) {

        if (verifyUser.user_exist) {
            return errorWithoutData('only admin can use this service.');
        }

        const admin = await this.adminRepository.findOneBy({ id, isActive: true, isDeleted: false });
        if (!admin) {
            return errorWithoutData('admin not found')
        }

        if (data.email) {
            const user_exist = await this.adminRepository.findOneBy({ email: data.email });
            if (user_exist) return errorWithoutData("can't update email")
        }

        await this.adminRepository.update(id.toString(), data);

        return successWithoutData('admin updated successfully');
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
        // Validate input
        if (!data.email || !data.password) {
            return errorWithoutData("Email and password are required");
        }

        // Check if user exists
        const user = await this.adminRepository.findOneBy({ email: data.email });
        if (!user) {
            return errorWithoutData("Invalid email or password");
        }

        // Check if active and not deleted
        if (!user.isActive || user.isDeleted) {
            return errorWithoutData("User is not allowed to login");
        }

        // Compare plain text passwords
        if (user.password !== data.password) {
            return errorWithoutData("Invalid email or password");
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user);

        const responseData = {
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            accessToken,
            refreshToken,
        };

        return successWithData("Login successful", responseData);
    }

}
