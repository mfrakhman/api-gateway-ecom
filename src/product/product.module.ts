import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { CategoriesController } from './categories.controller';
import { GendersController } from './genders.controller';
import { CategoryGroupsController } from './category-groups.controller';
import { ColorsController } from './colors.controller';
import { SizesController } from './sizes.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [
    ProductController,
    CategoriesController,
    GendersController,
    CategoryGroupsController,
    ColorsController,
    SizesController,
  ],
})
export class ProductModule {}
