import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Talle } from '../interfaces/talles.interface';

@Schema()
export class Producto {
  @Prop({ required: true })
  tipo: string;

  @Prop({ required: true })
  marca: string;

  @Prop({ required: true })
  descripcion: string;

  @Prop({ type: [String], required: true })
  colores: string[];

  @Prop({ required: true })
  talle: Talle[];

  @Prop({ required: true })
  precio: number;

  @Prop({ required: true })
  codigo: string;

  @Prop({ required: true })
  genero: string;

  @Prop({ required: true })
  proveedor: string;

  @Prop({ required: true })
  disciplina: string;

}

export const ProductoSchema = SchemaFactory.createForClass(Producto);

ProductoSchema.pre('save', function () {
  if (this.talle) {
    this.talle = this.talle.map(talle => ({
      talle: talle.talle.toUpperCase(),
      cantidad: talle.cantidad,
    }));
  }
  if(this.colores){
    this.colores = this.colores.map(color => (
      color.toUpperCase()
    ));
  }
  if(this.codigo){
    this.codigo = this.codigo.toUpperCase()
  }
});
