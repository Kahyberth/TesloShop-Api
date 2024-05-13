import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { HandleException } from 'src/common/interfaces/error';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService {

    private readonly logger = new  Logger('ProductsService');

   constructor(
     @InjectRepository(Product)
     private readonly productRepository: Repository<Product>
   ) {}



  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save( product );
      return product;
    } catch(error) {
      this.handleExceptions(error);
    }
  }


  async findAll({ limit = 1 , offset = 0 }: PaginationDto) {
    return await this.productRepository.find({
      take: limit,
      skip: offset,
      //TODO: Relations
    });
  }

  async findOne(id: string) {
      const product = await this.productRepository.findBy({id});
      if ( product.length === 0 ) throw new NotFoundException(`Product whit id: ${ id } not found`)
      return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async delete(id: string) {
    const product = await this.findOne( id );
    return await this.productRepository.delete({id})
  }

  private handleExceptions(error: HandleException) {
    if ( error.code === '23505' ) throw new BadRequestException(error.detail);
    if ( error.code === '11000' ) throw new NotFoundException(`Product not found!`)
    this.logger.error( error );
    throw new InternalServerErrorException('Unexpected error, check your console log');
  }


}
