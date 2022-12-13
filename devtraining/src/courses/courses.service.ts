import { NotFoundException, Injectable } from '@nestjs/common';
import { Course } from './entities/course.entity';
import { InjectRepository } from '@nestjs/typeorm/dist';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto/update-course.dto';
import { Tag } from './entities/tag.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>, //courseRepository pode ser qualquer nome

    @InjectRepository(Tag) // parte do relacionamento da entidade Tag
    private readonly tagRepository: Repository<Tag>,
  ) {}

  //******************Lista todos******************************** */
  findAll() {
    return this.courseRepository.find({
      relations: ['tags'],
    });
  }
  //******************Lista UM************************************* */

  findOne(id: string) {
    const course = this.courseRepository.findOne({
      where: { id: Number(id) },
      relations: ['tags'], // faz parte do relacionamento
    }); // Tratamento de erro caso o id nao seja encontrado
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return course;
  }

  //******************Cria um item********************************* */
  async create(createCourseDto: CreateCourseDto) {
    // metodo para criar as tags
    const tags = await Promise.all(
      createCourseDto.tags.map((name) => this.preloadTagByName(name)),
    ); // Fim desse metodo

    const course = this.courseRepository.create({
      ...createCourseDto,
      tags, // adicionando tags dentro do create
    });
    return this.courseRepository.save(course);
  }

  //****************Atualizar o item ********************************** */
  async upate(id: string, updateCourseDto: UpdateCourseDto) {
    // metodo para atualizar as tags
    const tags =
      updateCourseDto.tags &&
      (await Promise.all(
        updateCourseDto.tags.map((name) => this.preloadTagByName(name)),
      ));
    // Fim desse metodo
    const course = await this.courseRepository.preload({
      id: +id,
      ...updateCourseDto,
      tags, // atualizando tags dentro do upate
    });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return this.courseRepository.save(course);
  }
  //***************Deletar o item********************************** */

  async remove(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id: Number(id) },
    });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return this.courseRepository.remove(course);
  }

  //**************************Metodo para fazer as alterações da entidade Tag */
  private async preloadTagByName(name: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { name } });
    if (tag) {
      return tag;
    }
    return this.tagRepository.create({ name });
  }
}
