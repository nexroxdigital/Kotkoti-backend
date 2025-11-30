import { Controller } from '@nestjs/common';
import { ReSellerManagementService } from './re-seller-management.service';

@Controller('re-seller-management')
export class ReSellerManagementController {
  constructor(private readonly reSellerManagementService: ReSellerManagementService) {}
}
