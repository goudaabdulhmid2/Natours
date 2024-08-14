class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObject = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObject[el]);

    // 1B) Advanced filtring
    let quearyStr = JSON.stringify(queryObject); //  { duration: { gte: '5' } }
    quearyStr = quearyStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );
    this.query = this.query.find(JSON.parse(quearyStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortedBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortedBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFileds() {
    // 3) Field limiting 127.0.0.1:8000/api/v1/tours?fields=name,duration,difficulty,price
    if (this.queryString.fields) {
      const fileds = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fileds);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 4) pagination. allowing user to only select a certain page of our results
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // ?page=2&limit=10  => page=2$limit=10, 1-10 page 1 , 11-20 page 2, 21-30 page 3  => ((page-1)*limit).

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
