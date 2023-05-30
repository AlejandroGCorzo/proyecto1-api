import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './producto.controller';
import { ProductsService } from './producto.service';
import { Product, ProductSchema } from './entities/producto.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
