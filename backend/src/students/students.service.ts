import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.student.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const row = await this.prisma.student.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Student not found');
    return row;
  }

  async create(dto: CreateStudentDto) {
    try {
      return await this.prisma.student.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          age: dto.age,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Email already exists');
      throw e;
    }
  }

  async update(id: string, dto: UpdateStudentDto) {
    // Ensure it exists first so we return 404 instead of a Prisma error.
    await this.get(id);
    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.email === undefined ? {} : { email: dto.email.trim().toLowerCase() }),
          ...(dto.age === undefined ? {} : { age: dto.age }),
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Email already exists');
      throw e;
    }
  }

  async remove(id: string) {
    // Ensure it exists first so we return 404 consistently.
    await this.get(id);
    await this.prisma.student.delete({ where: { id } });
    return { ok: true };
  }
}

