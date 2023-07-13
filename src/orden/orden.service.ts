import { BadGatewayException, BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { UpdateOrdenDto } from './dto/update-orden.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Orden } from './entities/orden.entity';
import { Model, Query } from 'mongoose';
import { ProductQuantity } from 'src/ordenes/interfaces/ProductQuantity.interface';
import { ClienteService } from '../cliente/cliente.service';
import { ProductosService } from 'src/producto/producto.service';
import { ProductQuantityNew } from './interfaces/ProductQuantity.interface';
import { MercadopagoService } from 'src/mercadopago/mercadopago.service';
import { MailService } from 'src/mail/mail.service';
import { PaymentMethod } from 'src/cliente/types/TypePayment.type';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CommonService } from 'src/common/common.service';
import moment from 'moment';
@Injectable()
export class OrdenService {
  constructor(
    @InjectModel(Orden.name) 
    private readonly ordenModel: Model<Orden>,
    private readonly clienteService:ClienteService,
    private readonly productsService:ProductosService,
    private readonly mercadopagoService:MercadopagoService,
    private readonly mailService:MailService,
    private readonly commonService:CommonService,
  ) {}
  async create(createOrdenDto: CreateOrdenDto) {

    let productsWithDetails: ProductQuantity[] = [];
    let totalWithoutDiscount = 0;
    let totalWithDiscount = 0;
    const customerEmail = createOrdenDto.Customer.email     

    const customer = await this.clienteService.create(createOrdenDto.Customer)
    const customerFullName = createOrdenDto.Customer.fullName
    console.log("customerFullName",customerFullName);
    
    for (const product of createOrdenDto.products) {
      // Buscar el producto por su ID
      const productFromDB = await this.productsService.findOne(product.product);
      console.log('productFromDB',productFromDB)
      if (!productFromDB) {
        throw new Error(`Product with ID ${product.product} not found`);
      }
  
      // Crear un objeto ProductQuantity con el producto y la cantidad
      const productWithDetails: ProductQuantity = {
        producto: productFromDB,
        cantidad: product.quantity,
      };
  
      // // Calcular el descuento adicional para este producto
      // const additionalDiscount = productFromDB.descuento || 0;
  
      // Actualizar el descuento del producto sumando el descuento adicional
      //productWithDetails.producto.descuento = productWithDetails.producto.descuento + additionalDiscount;
      
      // Calcular el total sin descuento y el total con descuento para este producto
      const subtotalWithoutDiscount = product.quantity * productFromDB.precio;
      const subtotalWithDiscount = subtotalWithoutDiscount * (1 - productWithDetails.producto.descuento / 100);
  
      // Sumar al total general
      totalWithoutDiscount += subtotalWithoutDiscount;
      totalWithDiscount += subtotalWithDiscount;
  
      // Agregar el producto con detalles al array
      productsWithDetails.push(productWithDetails);
    }
    createOrdenDto.Customer=customer.customer.id
    createOrdenDto.products=productsWithDetails
    createOrdenDto.totalWithDiscount=totalWithDiscount
    createOrdenDto.totalWithOutDiscount=totalWithoutDiscount
    try {
      let newOrder = await this.ordenModel.create(createOrdenDto)
      console.log("newOrder",newOrder);
      if(newOrder.payType==PaymentMethod.MERCADOPAGO){
        let linkMP = await this.mercadopagoService.create(newOrder.products)
        let code = this.generateCode()
        console.log('code',code, createOrdenDto)
        newOrder.tokenClient=code
        await newOrder.save()
        await newOrder.populate('Customer')
        await this.mailService.send_code_mail_for_order(customerEmail,newOrder.id,code,newOrder, customerFullName)
        return {orden:newOrder, linkMP:linkMP }
      }
      if(newOrder.payType==PaymentMethod.TRANSFERENCIA){
        let code = this.generateCode()
        console.log('code',code)
        newOrder.tokenClient=code
        await newOrder.save()
        newOrder.populate('Customer')
        await this.mailService.send_code_mail_Transferencia(customerEmail,newOrder.id,code)
        return {orden:newOrder }
      }
      if(newOrder.payType==PaymentMethod.DEPOSITO){
        let code = this.generateCode()
        console.log('code',code)
        newOrder.tokenClient=code
        await newOrder.save()
        newOrder.populate('Customer')
        await this.mailService.send_code_mail_Deposito(customerEmail,newOrder.id,code)
        return {orden:newOrder }
      }
      let code = this.generateCode()
      newOrder.tokenClient=code
      await newOrder.save()
      newOrder.populate('Customer')
      return newOrder
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async findAll(paginationDto:PaginationDto) {
    try {
      // const allOrders = await this.ordenModel.find()
      // return allOrders
      const { limit = 10, offset = 1, status } = paginationDto;

      const query = this.ordenModel.find().populate('Customer');

      if (status) {
        query.where('status', status);
      }

      let totalElements:number = await this.ordenModel.countDocuments(query).exec()
      let currentpage:number;
      let maxpages:number;
      let orders:any

      if (offset > 0) {
        orders = await query
          .find()
          .limit(limit)
          .skip((offset - 1)*limit)
          .sort({ no: 1 })
      }

      if(totalElements>0){
        if(totalElements%limit==0){
          maxpages=totalElements/limit
          currentpage=offset==0?offset+1:offset
        }
          maxpages=totalElements/limit
          maxpages= Math.ceil(maxpages)
          currentpage=(offset>0?offset:offset+1)
      }
      return {
        orders,
        totalElements,
        maxpages,
        currentpage,
      };
    } catch (error) {
      await this.commonService.handleExceptions(error)
    }
  }

  async getOrdenesByDateRange( paginationDto:PaginationDto): Promise<Orden[]> {
    const {startDate, endDate, status} = paginationDto;
    try {
      
      const startDateFormatted = moment(startDate, 'DD.MM.YYYY').toDate();
      const endDateFormatted = moment(endDate, 'DD.MM.YYYY').toDate();
      let ordenes: Query<Orden[], Orden>
      if(startDate&&endDate){
        if(!status){
           ordenes = this.ordenModel.find({
            orderDate: {
              $gte: moment(startDateFormatted).startOf('day').toDate()||Date(),
              $lte: moment(endDateFormatted).endOf('day').toDate()||Date(),
            },
          });
        }else{
          ordenes = this.ordenModel.find({
            status:status,
            orderDate: {
              $gte: moment(startDateFormatted).startOf('day').toDate(),
              $lte: moment(endDateFormatted).endOf('day').toDate(),
            },
          });
        }
        return await ordenes.exec();
      } else{
        throw new BadRequestException('Debe ingresar una fecha de inicio y una final.')
      }
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} orden`;
  }

  update(id: number, updateOrdenDto: UpdateOrdenDto) {
    return `This action updates a #${id} orden`;
  }

  remove(id: number) {
    return `This action removes a #${id} orden`;
  }
  ////////////////////////////////Client/////////////////////////
  async findByCode(code:number){
    const order = await this.ordenModel.findOne({tokenClient:code}).populate('Customer')
    if (!order){
      throw new NotFoundException('el codigo ingresado es incorrecto.')
    }
    return order
  }
  ////////////////////////////////Helper/////////////////////////
  generateCode(){
    const code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);  
    return code
  }
}