import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('PRODUCT_SERVICE_URL')!;
  }

  async getAllProducts() {
    const res = await firstValueFrom(this.http.get(`${this.baseUrl}/products`));
    return res.data;
  }
}
