import { Vacation } from "../models/Vacation";

export default class VacationsUtils {
    public static getVacationIndex(compState: any, vacation: Vacation) {
        let index = compState.vacations.map(function (vacationToFind: Vacation) {
            return vacationToFind.id;
        }).indexOf(vacation.id);

        return index;
    }
}