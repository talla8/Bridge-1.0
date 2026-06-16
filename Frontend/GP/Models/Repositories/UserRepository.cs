using GP.Data;

namespace GP.Models.Repositories
{
    public class UserRepository : IRepository<User>
    {
        public AppDbContext db { get; }
        public UserRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.User.Update(entity);
            db.SaveChanges();
        }

        public void Add(User entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.User.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.User.Update(entity);
            db.SaveChanges();
        }

        public User Find(int Id)
        {
            return db.User.SingleOrDefault(x => x.UserId == Id);
        }

        public void Update(int Id, User entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.User.Update(entity);
            db.SaveChanges();
        }

        public List<User> ViewAdmin()
        {
            return db.User.Where(x => x.IsDelete == false).ToList();
        }

        public List<User> ViewClient()
        {
            return db.User.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
