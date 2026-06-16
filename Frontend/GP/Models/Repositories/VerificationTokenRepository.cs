using GP.Data;

namespace GP.Models.Repositories
{
    public class VerificationTokenRepository : IRepository<VerificationToken>
    {
        public AppDbContext db { get; }
        public VerificationTokenRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.VerificationToken.Update(entity);
            db.SaveChanges();
        }

        public void Add(VerificationToken entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.VerificationToken.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.VerificationToken.Update(entity);
            db.SaveChanges();
        }

        public VerificationToken Find(int Id)
        {
            return db.VerificationToken.SingleOrDefault(x => x.VerificationTokenId == Id);
        }

        public void Update(int Id, VerificationToken entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.VerificationToken.Update(entity);
            db.SaveChanges();
        }

        public List<VerificationToken> ViewAdmin()
        {
            return db.VerificationToken.Where(x => x.IsDelete == false).ToList();
        }

        public List<VerificationToken> ViewClient()
        {
            return db.VerificationToken.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
