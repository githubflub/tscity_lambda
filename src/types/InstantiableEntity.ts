import { BaseEntity } from 'typeorm'

export interface NewableType<ClassType extends BaseEntity> {
   new (data: Partial<ClassType>): ClassType;
}

export type InstantiableEntity<ClassType extends BaseEntity> = { [P in keyof typeof BaseEntity]?: typeof BaseEntity[P]; } & NewableType<ClassType>