import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bcrypt } from 'src/auth/bcrypt/bcrypt';
import { MessagesHelper } from 'src/helpers/messages.helpers';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private bcrypt: Bcrypt,
  ) {}
  
  /**
   * @desc search for a registered user in the database
   * @returns the promise to see a one user
   */
  async findByUser(user: string): Promise<User>{
    return await this.userRepository.findOne({
      where: {
        user,
      },
    });
  }

  /**
   * @desc search for all users registered in the database
   * @returns the promise to see all users
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * @desc search for user by ID
   * @throw HttpException in case the id is not found in the database
   * @param id that will be searched in the database
   * @returns a promise to search for the user id
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        product: true,
      },
    });

    if (!user)
      throw new HttpException(
        MessagesHelper.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );

    return user;
  }

  /**
   * @desc add new user to database
   * @Body where the order should be placed
   * @returns a promise that the user was registered in the database
   */
  async create(data: User): Promise<User> {
    const userSearch = await this.findByUser(data.user);

    if (!userSearch) {
      data.password = await this.bcrypt.hashPassword(data.password);
      const user = this.userRepository.create(data);
      return await this.userRepository.save(user);
    }

    throw new HttpException(
      MessagesHelper.EXISTING_USER,
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * @desc updates a user that is registered in the database through the ID
   @ @Body where the order should be placed
   * @returns a promise that the user has been updated in the database
   */
  async update(user: User): Promise<User> {
    const userUpdate: User = await this.findById(user.id);
    const userSearch = await this.findByUser(user.user);

    if (!userUpdate)
      throw new HttpException(
        MessagesHelper.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );

    if (userSearch && userSearch.id != user.id)
      throw new HttpException(
        MessagesHelper.EXISTING_USER,
        HttpStatus.BAD_REQUEST,
      );

    user.password = await this.bcrypt.hashPassword(user.password);
    this.userRepository.merge(userUpdate, user);
    return await this.userRepository.save(userUpdate);
  }
}
