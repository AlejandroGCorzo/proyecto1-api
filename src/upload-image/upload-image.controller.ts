import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UploadImageService } from './upload-image.service';

import { UpdateUploadImageDto } from './dto/update-upload-image.dto';
import { CreateUploadImageDto } from './dto/create-upload-image.dto';
import { DeleteUploadImageDto } from './dto/delete-upload-image.dto';

@Controller('upload-image')
export class UploadImageController {
  constructor(private readonly uploadImageService: UploadImageService) {}

  @Post()
  create(@Body() createUploadImageDto: CreateUploadImageDto) {
    return this.uploadImageService.create(createUploadImageDto);
  }

  @Get()
  findAll() {
    return this.uploadImageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadImageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUploadImageDto: UpdateUploadImageDto) {
    return this.uploadImageService.update(+id, updateUploadImageDto);
  }

  @Delete()
  deleteFile(@Body() deleteUploadImageDto: DeleteUploadImageDto) {
    return this.uploadImageService.deleteFile(deleteUploadImageDto);
  }
}
