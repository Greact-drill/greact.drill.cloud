export class Edge {
  id: string;
  name: string;
  parent_id?: string;
  parent?: Edge;
  children?: Edge[];
  createdAt?: Date;
  updatedAt?: Date;
}