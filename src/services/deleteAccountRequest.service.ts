import { Admin } from "../entities/Admin";
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { deleteUserToken } from "../utils/jwtUtils";
import { DeleteAccountRequest } from "../entities/DeleteAccountRequest";

export class DeleteAccountRequestService {

    private userRepository = AppDataSource.getRepository(User);
    private adminRepository = AppDataSource.getRepository(Admin);
    private deleteRequestRepository = AppDataSource.getRepository(DeleteAccountRequest)

    public async getAllDeleteRequests(pageSize: number, currentPage: number, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service');
        }
        const [requests, totalItems] = await this.deleteRequestRepository.findAndCount({
            relations: ["user_id"],
            order: { requested_at: "DESC" },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        });

        const totalPages = Math.ceil(totalItems / pageSize);
        return successWithData("Delete account requests retrieved", requests, {
            totalItems,
            totalPages,
            currentPage,
            pageSize,
        });
    }

    public async createDeleteRequest(userId: string, reason: string) {
        // if (verifyUser.user_exist) {
        //     return errorWithoutData('Only admin can use this service');
        // }

        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            return errorWithoutData("User not found");
        }

        const existingRequest = await this.deleteRequestRepository.findOneBy({ user_id: { id: user.id }, });
        if (existingRequest) {
            return errorWithoutData("Delete request already exists for this user");
        }

        const deleteRequest = this.deleteRequestRepository.create({
            user_id: { id: user.id }, // Store user ID, not the entire object
            request_reason: reason,
            request_status: "PENDING",
        });

        await this.deleteRequestRepository.save(deleteRequest);
        return successWithData("Delete account request created", deleteRequest);
    }

    public async updateRequestStatus(requestId: string, status: "COMPLETED" | "REJECTED", processedBy: string, verifyUser: any) {
        console.log(processedBy)
        if (verifyUser.user_exist) {
            return errorWithoutData('Only admin can use this service');
        }

        const request = await this.deleteRequestRepository.findOne({ where: { id: requestId }, relations: ["user_id"] });

        if (!request) {
            return errorWithoutData("Delete request not found");
        }

        // if (request.request_status !== "PENDING") {
        //     return errorWithoutData("Request has already been processed");
        // }
        request.request_status = status;
        request.processed_at = new Date();
        request.processed_by = verifyUser;

        await this.deleteRequestRepository.save(request);
        return successWithoutData(`Request ${status.toLowerCase()} successfully`);
    }
}
