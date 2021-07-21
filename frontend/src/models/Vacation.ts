export class Vacation{
    public constructor(
        public id: string,
        public destination: string,
        public description: string,
        public picture: any,
        public startDate: string,
        public endDate: string,
        public price: number,
        public numOfFollowers?: number,
        public isFavorite?: boolean
    ){}   
}