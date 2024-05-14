import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { HandleException } from 'src/common/interfaces/error';
import { PaginationDto } from 'src/common/dto/pagination.dto';

import { validate as isUUID } from 'uuid'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }



  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
  }


  async findAll({ limit = 1, offset = 0 }: PaginationDto) {
    return await this.productRepository.find({
      take: limit,
      skip: offset,
      //TODO: Relations
    });
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();

      product = await queryBuilder.where('UPPER(title) =:title or slug =:slug', {
        title: term.toLowerCase(),
        slug: term.toLowerCase()
      }).getOne();
    }


    if (!product) throw new NotFoundException(`Product whit id: ${term} not found`)
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id,
      ...updateProductDto
    });

    if ( !product ) throw new NotFoundException(`Product whit id: ${ id } not found!`);

    try {
      await this.productRepository.save( product );
    } catch(error) {
      this.handleExceptions(error);
    }
    
    return product;
  }

  async delete(id: string) {
    const product = await this.findOne(id);
    return await this.productRepository.delete({ id })
  }

  private handleExceptions(error: HandleException) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    if (error.code === '11000') throw new NotFoundException(`Product not found!`)
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check your console log');
  }


}
