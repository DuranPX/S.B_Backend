package com.SBuses.demo.Repository;

import com.SBuses.demo.Models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Cuenta cuántos usuarios tienen un rol asignado (para validar antes de eliminar rol)
    long countByRolesContaining(String roleName);

    // Búsqueda de usuarios por nombre o email (case-insensitive, parcial)
    @Query("{ $or: [ " +
           "{ 'name': { $regex: ?0, $options: 'i' } }, " +
           "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'email': { $regex: ?0, $options: 'i' } } " +
           "] }")
    List<User> searchByNameOrEmail(String query);
}